import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../../hooks/ui/useProgressiveValidation.js";

function ValidateTextInput({ label, placeholder, name, strictMode = false, maxLength = 100 }) {
    const { register, formState: { errors }, setValue } = useFormContext();
    const { validateLength } = useProgressiveValidation();

    const handleInput = (e) => {
        const value = e.target.value;
        const validation = validateLength(value, maxLength, label || "Champ", {
            warningThreshold: 0.8, // 80% of limit
            infoThreshold: 0.6,    // 60% of limit
            showCount: true
        });

        if (validation.shouldTruncate) {
            const truncated = value.slice(0, maxLength);
            e.target.value = truncated;
            setValue(name, truncated);
        } else {
            setValue(name, value);
        }
    }
    return (
        <div className="w-full md:w-[48%] mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>{label}</label>
            <input type="text" placeholder={placeholder} {...register(name)} id={name} onInput={strictMode ? handleInput : ""} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none placeholder-gray-5000 ${errors[name] ? "border-red-500 focus:ring-red-700" : "border-blue-500 focus:ring-blue-500"}`} />
            {errors[name] && (
                <p className="text-red-600 mt-1 text-sm transition-opacity duration-300">{errors[name].message}</p>
            )}
        </div>
    )
}

export default ValidateTextInput;