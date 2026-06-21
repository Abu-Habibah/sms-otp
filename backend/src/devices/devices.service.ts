import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { TenantScopedPrismaService } from '../common/prisma/tenant-scoped-prisma.service';
import { RawPrismaService } from '../common/prisma/raw-prisma.service';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: TenantScopedPrismaService,
    private readonly raw: RawPrismaService,
  ) {}

  async claim(
    code: string,
    publicKey: string,
    deviceInfo?: {
      manufacturer?: string;
      model?: string;
      osVersion?: string;
      appVersion?: string;
      simSlot1Number?: string;
      simSlot2Number?: string;
      deviceModel?: string;
      androidVersion?: string;
    },
  ) {
    // Find and validate the claim code (raw query — public endpoint, no tenant context)
    const claimCode = await this.raw.claimCode.findUnique({ where: { code } });
    if (!claimCode) {
      throw new NotFoundException('Claim code not found');
    }
    if (claimCode.usedAt) {
      throw new ConflictException('Claim code already used');
    }
    if (claimCode.expiresAt < new Date()) {
      throw new ConflictException('Claim code expired');
    }

    // Check if device with this public key already exists in this workspace
    const existingDevice = await this.raw.device.findFirst({
      where: { publicKey: publicKey, workspaceId: claimCode.workspaceId }
    });

    if (existingDevice) {
      if (existingDevice.status === 'REVOKED') {
        const now = new Date();
        const updatedDevice = await this.raw.device.update({
          where: { id: existingDevice.id },
          data: {
            status: 'ACTIVE',
            lastSeenAt: now,
            lastHeartbeat: now,
            ...(deviceInfo?.manufacturer !== undefined && { manufacturer: deviceInfo.manufacturer }),
            ...(deviceInfo?.model !== undefined && { model: deviceInfo.model }),
            ...(deviceInfo?.osVersion !== undefined && { osVersion: deviceInfo.osVersion }),
            ...(deviceInfo?.appVersion !== undefined && { appVersion: deviceInfo.appVersion }),
            ...(deviceInfo?.simSlot1Number !== undefined && { simSlot1Number: deviceInfo.simSlot1Number }),
            ...(deviceInfo?.simSlot2Number !== undefined && { simSlot2Number: deviceInfo.simSlot2Number }),
            ...(deviceInfo?.deviceModel !== undefined && { deviceModel: deviceInfo.deviceModel }),
            ...(deviceInfo?.androidVersion !== undefined && { androidVersion: deviceInfo.androidVersion }),
          },
        });

        await this.raw.claimCode.update({
          where: { id: claimCode.id },
          data: { usedAt: new Date() },
        });

        const workspace = await this.raw.workspace.findUnique({
          where: { id: updatedDevice.workspaceId },
        });

        return {
          device: {
            id: updatedDevice.id,
            name: updatedDevice.name,
            status: updatedDevice.status,
            createdAt: updatedDevice.createdAt.toISOString(),
            workspaceId: updatedDevice.workspaceId,
            workspaceName: workspace?.name ?? null,
          },
          apiKey: updatedDevice.apiKey,
          serverUrl: process.env['PUBLIC_API_BASE_URL'] ?? 'http://localhost:6001',
        };
      }

      // Device already claimed and active
      throw new ConflictException('Device already claimed');
    }

    const now = new Date();
    const device = await this.raw.device.create({
      data: {
        tenantId: claimCode.tenantId,
        workspaceId: claimCode.workspaceId,
        name: deviceInfo?.manufacturer ? `${deviceInfo.manufacturer} ${deviceInfo.model ?? ''}`.trim() : 'Claimed Device',
        status: 'ACTIVE',
        deviceSecret: crypto.randomUUID(),
        publicKey,
        lastSeenAt: now,
        lastHeartbeat: now,
        manufacturer: deviceInfo?.manufacturer ?? null,
        model: deviceInfo?.model ?? null,
        osVersion: deviceInfo?.osVersion ?? null,
        appVersion: deviceInfo?.appVersion ?? null,
        simSlot1Number: deviceInfo?.simSlot1Number ?? null,
        simSlot2Number: deviceInfo?.simSlot2Number ?? null,
        deviceModel: deviceInfo?.deviceModel ?? null,
        androidVersion: deviceInfo?.androidVersion ?? null,
      },
    });

    // Fetch workspace name for response
    const workspace = await this.raw.workspace.findUnique({
      where: { id: device.workspaceId },
    });

    // Mark claim code as used
    await this.raw.claimCode.update({
      where: { id: claimCode.id },
      data: { usedAt: new Date(), usedByDeviceId: device.id },
    });

    return {
      device: {
        id: device.id,
        name: device.name,
        status: device.status,
        createdAt: device.createdAt.toISOString(),
        workspaceId: device.workspaceId,
        workspaceName: workspace?.name ?? null,
      },
      apiKey: device.apiKey,
      serverUrl: process.env['PUBLIC_API_BASE_URL'] ?? 'http://localhost:6001',
    };
  }

  async list() {
    return this.prisma.device.findMany({
      orderBy: [
        { lastSeenAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'asc' },
      ],
    });
  }

  async findById(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async update(id: string, data: { name?: string }) {
    const device = await this.findById(id);
    return this.prisma.device.update({ where: { id: device.id }, data });
  }

  async suspend(id: string) {
    const device = await this.findById(id);
    if (device.status === 'REVOKED') throw new ConflictException('Cannot suspend a revoked device');
    return this.prisma.device.update({ where: { id: device.id }, data: { status: 'SUSPENDED' } });
  }

  async resume(id: string) {
    const device = await this.findById(id);
    if (device.status === 'REVOKED') throw new ConflictException('Cannot resume a revoked device');
    return this.prisma.device.update({ where: { id: device.id }, data: { status: 'ACTIVE' } });
  }

  async reactivate(id: string) {
    const device = await this.findById(id);
    if (device.status !== 'REVOKED') throw new ConflictException('Only revoked devices can be reactivated');
    return this.prisma.device.update({ where: { id: device.id }, data: { status: 'ACTIVE' } });
  }

  async revoke(id: string) {
    const device = await this.findById(id);
    return this.prisma.device.update({ where: { id: device.id }, data: { status: 'REVOKED' } });
  }

  async heartbeat(
    id: string,
    deviceInfo?: {
      manufacturer?: string;
      model?: string;
      osVersion?: string;
      appVersion?: string;
      simSlot1Number?: string;
      simSlot2Number?: string;
      deviceModel?: string;
      androidVersion?: string;
    },
  ) {
    // Use raw — the ApiKeyAuthGuard has already verified the device
    // so we don't need tenant scoping here, and the guard may not have
    // seeded the AsyncLocalStorage context required by prisma.
    const device = await this.raw.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');
    if (device.status === 'REVOKED') throw new NotFoundException('Device revoked');

    const now = new Date();
    return this.raw.device.update({
      where: { id },
      data: {
        lastSeenAt: now,
        lastHeartbeat: now,
        ...(deviceInfo?.manufacturer !== undefined && { manufacturer: deviceInfo.manufacturer }),
        ...(deviceInfo?.model !== undefined && { model: deviceInfo.model }),
        ...(deviceInfo?.osVersion !== undefined && { osVersion: deviceInfo.osVersion }),
        ...(deviceInfo?.appVersion !== undefined && { appVersion: deviceInfo.appVersion }),
        ...(deviceInfo?.simSlot1Number !== undefined && { simSlot1Number: deviceInfo.simSlot1Number }),
        ...(deviceInfo?.simSlot2Number !== undefined && { simSlot2Number: deviceInfo.simSlot2Number }),
        ...(deviceInfo?.deviceModel !== undefined && { deviceModel: deviceInfo.deviceModel }),
        ...(deviceInfo?.androidVersion !== undefined && { androidVersion: deviceInfo.androidVersion }),
      },
    });
  }

  async triggerIdentification(deviceId: string) {
    const device = await this.raw.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');

    return this.raw.device.update({
      where: { id: deviceId },
      data: { identifyRequestedAt: new Date(), identifyAckedAt: null },
    });
  }

  async checkIdentification(deviceId: string) {
    const device = await this.raw.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');

    return {
      identifyRequestedAt: device.identifyRequestedAt,
      identifyAckedAt: device.identifyAckedAt,
    };
  }

  async acknowledgeIdentification(deviceId: string) {
    const device = await this.raw.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');

    return this.raw.device.update({
      where: { id: deviceId },
      data: { identifyAckedAt: new Date() },
    });
  }
}
