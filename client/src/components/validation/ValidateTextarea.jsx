import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../../hooks/ui/useProgressiveValidation.js";
import { useState } from "react";

function ValidatedTextarea({ name, label, placeholder = "", maxLength = 100 }) {
  const { register, formState: { errors }, setValue } = useFormContext();
  const { validateLength } = useProgressiveValidation();
  const [charCount, setCharCount] = useState(0);

  const handleInput = (e) => {
    const value = e.target.value;
    const validation = validateLength(value, maxLength, label || "Champ", {
      warningThreshold: 0.8, // 80% of limit
      infoThreshold: 0.6,    // 60% of limit
      showCount: true,
      cooldownMs: 4000       // 4 seconds between notifications
    });

    if (validation.shouldTruncate) {
      const truncated = value.slice(0, maxLength);
      e.target.value = truncated;
      setValue(name, truncated);
      setCharCount(truncated.length);
    } else {
      setValue(name, value);
      setCharCount(value.length);
    }
  };

  return (
    <div className="w-full md:w-[48%] mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        id={name}
        placeholder={placeholder}
        {...register(name)}
        onInput={handleInput}
        rows={4}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm resize-none focus:outline-none ${errors[name] ? "border-red-500 focus:ring-red-500" : "border-blue-500 focus:ring-blue-500"
          }`}
      />
      <div className="flex justify-between items-center mt-1 text-sm">
        <span className="text-gray-500">{charCount}/{maxLength} characters</span>
        {errors[name] && (
          <span className="text-red-600 transition-opacity duration-300">{errors[name].message}</span>
        )}
      </div>
    </div>
  );
}

export default ValidatedTextarea;
