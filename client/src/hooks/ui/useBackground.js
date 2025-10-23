import { useEffect } from "react";

function useBackground(className, selector = 'body') {
    useEffect(() => {
    const target = document.querySelector(selector);
        if (target) {
            target.classList.add(className);
            return () => {
                target.classList.remove(className);
            }
        }
    }, [className, selector])
}

export default useBackground;