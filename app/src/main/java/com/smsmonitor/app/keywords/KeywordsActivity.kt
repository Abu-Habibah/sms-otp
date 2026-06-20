package com.smsmonitor.app.keywords

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.smsmonitor.R
import com.smsmonitor.databinding.ActivityKeywordsBinding
import com.smsmonitor.databinding.DialogAddKeywordBinding
import com.smsmonitor.domain.model.Keyword
import com.smsmonitor.domain.model.MatchMode
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class KeywordsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityKeywordsBinding
    private val viewModel: KeywordsViewModel by viewModels()
    private lateinit var adapter: KeywordsAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityKeywordsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViews()
        observeState()
    }

    private fun setupViews() {
        adapter = KeywordsAdapter(
            onToggle = { keyword -> viewModel.toggleKeyword(keyword) },
            onEdit = { keyword -> showEditKeywordDialog(keyword) },
            onDelete = { keyword -> showDeleteConfirmation(keyword) }
        )

        binding.keywordsRecyclerView.layoutManager = LinearLayoutManager(this)
        binding.keywordsRecyclerView.adapter = adapter

        val swipeHandler = object : ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.LEFT) {
            override fun onMove(
                recyclerView: RecyclerView,
                viewHolder: RecyclerView.ViewHolder,
                target: RecyclerView.ViewHolder
            ): Boolean = false

            override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {
                val position = viewHolder.adapterPosition
                val keyword = adapter.currentList[position]
                viewModel.deleteKeyword(keyword)
            }
        }
        ItemTouchHelper(swipeHandler).attachToRecyclerView(binding.keywordsRecyclerView)

        binding.addKeywordFab.setOnClickListener {
            showAddKeywordDialog()
        }
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.keywords.collect { keywords ->
                adapter.submitList(keywords)
                binding.keywordsRecyclerView.visibility = if (keywords.isEmpty()) View.GONE else View.VISIBLE
                binding.emptyText.visibility = if (keywords.isEmpty()) View.VISIBLE else View.GONE
            }
        }
        lifecycleScope.launch {
            viewModel.error.collect { message ->
                if (message != null) {
                    Toast.makeText(this@KeywordsActivity, message, Toast.LENGTH_SHORT).show()
                    viewModel.clearError()
                }
            }
        }
    }

    private fun showAddKeywordDialog() {
        showKeywordDialog(existing = null)
    }

    private fun showEditKeywordDialog(keyword: Keyword) {
        showKeywordDialog(existing = keyword)
    }

    private fun showKeywordDialog(existing: Keyword?) {
        val isEdit = existing != null
        val dialogBinding = DialogAddKeywordBinding.inflate(layoutInflater)

        dialogBinding.titleText.text = if (isEdit) "Edit Keyword" else "Add Keyword"
        if (isEdit && existing != null) {
            dialogBinding.keywordInput.setText(existing.word)
            val targetId = when (existing.matchMode) {
                MatchMode.EXACT -> R.id.radioExact
                MatchMode.CONTAINS -> R.id.radioContains
                MatchMode.AT_START -> R.id.radioAtStart
                MatchMode.AT_END -> R.id.radioAtEnd
                MatchMode.REGEX -> R.id.radioRegex
            }
            dialogBinding.matchModeGroup.check(targetId)
        }

        val positiveLabel = if (isEdit) "Save" else "Add"
        val editing: Keyword? = if (isEdit) existing else null

        val dialog = AlertDialog.Builder(this)
            .setView(dialogBinding.root)
            .setPositiveButton(positiveLabel) { _, _ ->
                val word = dialogBinding.keywordInput.text.toString().trim()
                val matchMode = when (dialogBinding.matchModeGroup.checkedRadioButtonId) {
                    R.id.radioExact -> MatchMode.EXACT
                    R.id.radioAtStart -> MatchMode.AT_START
                    R.id.radioAtEnd -> MatchMode.AT_END
                    R.id.radioRegex -> MatchMode.REGEX
                    else -> MatchMode.CONTAINS
                }
                val target = editing
                if (target != null) {
                    viewModel.updateKeyword(target, word, matchMode)
                } else {
                    viewModel.addKeyword(word, matchMode)
                }
            }
            .setNegativeButton("Cancel", null)
            .create()

        dialog.show()
    }

    private fun showDeleteConfirmation(keyword: Keyword) {
        AlertDialog.Builder(this)
            .setTitle("Delete Keyword")
            .setMessage("Are you sure you want to delete \"${keyword.word}\"?")
            .setPositiveButton("Delete") { _, _ ->
                viewModel.deleteKeyword(keyword)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
