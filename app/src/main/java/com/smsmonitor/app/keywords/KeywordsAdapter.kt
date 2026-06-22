package com.smsmonitor.app.keywords

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.smsmonitor.R
import com.smsmonitor.databinding.ItemKeywordBinding
import com.smsmonitor.domain.model.Keyword
import com.smsmonitor.domain.model.MatchMode

class KeywordsAdapter(
    private val onToggle: (Keyword) -> Unit,
    private val onEdit: (Keyword) -> Unit,
    private val onDelete: (Keyword) -> Unit
) : ListAdapter<Keyword, KeywordsAdapter.KeywordViewHolder>(KeywordDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): KeywordViewHolder {
        val binding = ItemKeywordBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return KeywordViewHolder(binding)
    }

    override fun onBindViewHolder(holder: KeywordViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class KeywordViewHolder(
        private val binding: ItemKeywordBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        init {
            binding.enabledSwitch.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onToggle(getItem(position))
                }
            }
            binding.editButton.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onEdit(getItem(position))
                }
            }
            binding.deleteButton.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onDelete(getItem(position))
                }
            }
        }

        fun bind(keyword: Keyword) {
            with(binding) {
                keywordText.text = keyword.word
                matchModeText.text = itemView.context.getString(
                    R.string.match_mode_label,
                    itemView.context.getString(getMatchModeResId(keyword.matchMode))
                )

                // Update switch state without triggering a listener
                enabledSwitch.isChecked = keyword.enabled
            }
        }

        private fun getMatchModeResId(mode: MatchMode): Int = when (mode) {
            MatchMode.EXACT -> R.string.match_mode_exact
            MatchMode.CONTAINS -> R.string.match_mode_contains
            MatchMode.AT_START -> R.string.match_mode_at_start
            MatchMode.AT_END -> R.string.match_mode_at_end
            MatchMode.REGEX -> R.string.match_mode_regex
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
