function SubmitBtn({
    label = "Envoyer", 
    loadingLabel = "Envoie en cours...", 
    loading = false, 
    icon = true, 
    className = "",
    variant = "default", // "default" | "custom"
    customClassName = "", // For custom styling when variant="custom"
    fullWidth = false, // Override default width behavior
    size = "default" // "default" | "large"
}) {
    // Default styles (original blue button)
    const defaultStyles = `w-full md:w-[48%] px-6 py-2 font-semibold rounded-md transition duration-300 ease-in-out flex items-center justify-center gap-2
        ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"} ${className}`;
    
    // Large size styles (for Register form)
    const largeStyles = `w-full px-4 py-3 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        ${loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"} ${className}`;
    
    // Custom styles (when variant="custom")
    const customStyles = customClassName;
    
    // Determine which styles to use
    let buttonStyles;
    if (variant === "custom") {
        buttonStyles = customStyles;
    } else if (size === "large") {
        buttonStyles = largeStyles;
    } else {
        buttonStyles = defaultStyles;
    }
    
    // Override width if fullWidth is specified
    if (fullWidth) {
        buttonStyles = buttonStyles.replace(/w-full md:w-\[48%\]/, 'w-full');
    }

    // Spinner size and style based on button size
    const spinnerSize = size === "large" ? "h-6 w-6 border-3" : "h-5 w-5 border-2";
    const spinnerStyle = size === "large" ? "animate-spin border-white border-t-transparent rounded-full" : "animate-spin border-white border-t-transparent rounded-full";

    return (
        <button 
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={buttonStyles}
        >
            {loading ? (
                <>
                    {icon && (
                        <span className={`${spinnerStyle} ${spinnerSize}`}></span>
                    )}
                    <span>{loadingLabel}</span>
                </>
            ) : (
                label
            )}
        </button>
    )
}

export default SubmitBtn;