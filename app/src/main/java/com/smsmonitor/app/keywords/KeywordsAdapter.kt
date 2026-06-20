package com.smsmonitor.app.keywords

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.Switch
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.smsmonitor.R
import com.smsmonitor.domain.model.Keyword

class KeywordsAdapter(
    private val onToggle: (Keyword) -> Unit,
    private val onEdit: (Keyword) -> Unit,
    private val onDelete: (Keyword) -> Unit
) : ListAdapter<Keyword, KeywordsAdapter.KeywordViewHolder>(KeywordDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): KeywordViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_keyword, parent, false)
        return KeywordViewHolder(view, onToggle, onEdit, onDelete)
    }

    override fun onBindViewHolder(holder: KeywordViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class KeywordViewHolder(
        itemView: View,
        private val onToggle: (Keyword) -> Unit,
        private val onEdit: (Keyword) -> Unit,
        private val onDelete: (Keyword) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        private val keywordText: TextView = itemView.findViewById(R.id.keywordText)
        private val matchModeText: TextView = itemView.findViewById(R.id.matchModeText)
        private val enabledSwitch: Switch = itemView.findViewById(R.id.enabledSwitch)
        private val editButton: ImageButton = itemView.findViewById(R.id.editButton)
        private val deleteButton: ImageButton = itemView.findViewById(R.id.deleteButton)

        fun bind(keyword: Keyword) {
            keywordText.text = keyword.word
            matchModeText.text = "Match: ${keyword.matchMode.name}"

            enabledSwitch.setOnCheckedChangeListener(null)
            enabledSwitch.isChecked = keyword.enabled
            enabledSwitch.setOnCheckedChangeListener { _, _ ->
                onToggle(keyword)
            }

            editButton.setOnClickListener { onEdit(keyword) }
            deleteButton.setOnClickListener { onDelete(keyword) }
        }
    }

    class KeywordDiffCallback : DiffUtil.ItemCallback<Keyword>() {
        override fun areItemsTheSame(oldItem: Keyword, newItem: Keyword): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Keyword, newItem: Keyword): Boolean {
            return oldItem == newItem
        }
    }
}

