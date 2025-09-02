function AsyncSubmitBtn({ 
    label = "Envoyer", 
    loadingLabel = "Envoie en cours...", 
    loading = false, 
    icon = true, 
    className = "" 
}) {
    return (
        <button type="submit"
        disabled={loading}
        aria-busy={loading}
        className={`w-full md:w-[48%] px-6 py-2 font-semibold rounded-md transition duration-300 ease-int-out flex item-center justify-center gap-2
            ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-700 text-white"} ${className}`}
        >
            {loading ? (
                <>
                    {icon && (
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent"></span>
                    )}
                    <span>{loadingLabel}</span>
                </>
            ) : (
                label
            )}
        </button>
    )
}

export default AsyncSubmitBtn;