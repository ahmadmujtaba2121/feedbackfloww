{
    comment.author.id === currentUser?.uid && (
        <button
            onClick={() => deleteComment(comment.id)}
            className="text-slate-400 hover:text-red-400"
            title="Delete comment"
        >
            <FiTrash2 className="w-4 h-4" />
        </button>
    )
} 