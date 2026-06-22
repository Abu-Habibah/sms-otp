package com.smsmonitor.app.keywords

import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.snackbar.Snackbar
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
    
    private val adapter by lazy {
        KeywordsAdapter(
            onToggle = { keyword -> viewModel.toggleKeyword(keyword) },
            onEdit = { keyword -> showEditKeywordDialog(keyword) },
            onDelete = { keyword -> showDeleteConfirmation(keyword) }
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityKeywordsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViews()
        observeState()
    }

    private fun setupViews() {
        binding.keywordsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@KeywordsActivity)
            adapter = this@KeywordsActivity.adapter
        }

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
                Snackbar.make(binding.root, "Keyword deleted", Snackbar.LENGTH_LONG)
                    .setAction("Undo") {
                        // If your ViewModel/Service supports restore, call it here
                        viewModel.addKeyword(keyword.word, keyword.matchMode)
                    }
                    .show()
            }
        }
        ItemTouchHelper(swipeHandler).attachToRecyclerView(binding.keywordsRecyclerView)

        binding.addKeywordFab.setOnClickListener {
            showAddKeywordDialog()
        }
    }

    private fun observeState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    adapter.submitList(state.keywords)
                    binding.keywordsRecyclerView.isVisible = state.keywords.isNotEmpty()
                    binding.emptyText.isVisible = state.keywords.isEmpty()
                    
                    // Show/hide a loading indicator if you have one
                    // binding.progressBar.isVisible = state.isLoading

                    state.error?.let {
                        Snackbar.make(binding.root, it, Snackbar.LENGTH_SHORT).show()
                        viewModel.clearError()
                    }
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
        
        existing?.let { keyword ->
            dialogBinding.keywordInput.setText(keyword.word)
            val targetId = when (keyword.matchMode) {
                MatchMode.EXACT -> R.id.radioExact
                MatchMode.CONTAINS -> R.id.radioContains
                MatchMode.AT_START -> R.id.radioAtStart
                MatchMode.AT_END -> R.id.radioAtEnd
                MatchMode.REGEX -> R.id.radioRegex
            }
            dialogBinding.matchModeGroup.check(targetId)
        }

        val positiveLabel = if (isEdit) "Save" else "Add"

        AlertDialog.Builder(this)
            .setView(dialogBinding.root)
            .setPositiveButton(positiveLabel) { _, _ ->
                val word = dialogBinding.keywordInput.text.toString().trim()
                
                if (word.isBlank()) {
                    Snackbar.make(binding.root, "Keyword cannot be empty", Snackbar.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                val matchMode = when (dialogBinding.matchModeGroup.checkedRadioButtonId) {
                    R.id.radioExact -> MatchMode.EXACT
                    R.id.radioAtStart -> MatchMode.AT_START
                    R.id.radioAtEnd -> MatchMode.AT_END
                    R.id.radioRegex -> MatchMode.REGEX
                    else -> MatchMode.CONTAINS
                }
                
                if (existing != null) {
                    viewModel.updateKeyword(existing, word, matchMode)
                } else {
                    viewModel.addKeyword(word, matchMode)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
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
