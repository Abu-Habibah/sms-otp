package com.smsmonitor.di

import android.content.Context
import androidx.room.Room
import com.smsmonitor.BuildConfig
import com.smsmonitor.app.worker.SmsHttpSender
import com.smsmonitor.data.local.AppDatabase
import com.smsmonitor.data.local.dao.ForwardingLogDao
import com.smsmonitor.data.local.dao.KeywordDao
import com.smsmonitor.data.local.dao.PendingForwardDao
import com.smsmonitor.data.repository.SettingsRepository
import com.smsmonitor.domain.service.ForwardingService
import com.smsmonitor.domain.service.MockSmsForwarder
import com.smsmonitor.domain.service.SmsForwarder
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "sms_monitor_db"
        ).build()
    }

    @Provides
    fun provideKeywordDao(database: AppDatabase): KeywordDao {
        return database.keywordDao()
    }

    @Provides
    fun provideForwardingLogDao(database: AppDatabase): ForwardingLogDao {
        return database.forwardingLogDao()
    }

    @Provides
    fun providePendingForwardDao(database: AppDatabase): PendingForwardDao {
        return database.pendingForwardDao()
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideSmsHttpSender(
        okHttpClient: OkHttpClient,
        settingsRepository: SettingsRepository
    ): SmsHttpSender = SmsHttpSender(okHttpClient, settingsRepository)

    @Provides
    @Singleton
    fun provideSmsForwarder(
        forwardingService: ForwardingService,
        mockSmsForwarder: MockSmsForwarder
    ): SmsForwarder {
        return if (BuildConfig.USE_MOCK_FORWARDER) {
            mockSmsForwarder.also { it.isEnabled = true }
        } else {
            forwardingService
        }
    }

    @Provides
    @Singleton
    fun provideMockSmsForwarder(): MockSmsForwarder {
        return MockSmsForwarder()
    }
}
