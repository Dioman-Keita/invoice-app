import { useFormContext } from "react-hook-form";
import useTostFeedBack from "../hooks/useToastFeedBack";

function ValidatedCodeInput({ name, label, placeholder }) {
  const { error } = useTostFeedBack();
  const {
    register,
    formState: { errors },
    setValue
  } = useFormContext();
  const handleInput = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "")
    if (raw.length > 4) error("Le code ne peut contenir que 4 chiffres");
    const trunced = raw.slice(0, 4);
    e.target.value = trunced;
    setValue(name, trunced);
  };

  return (
    <div className="w-full md:w-[48%] mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{4}"
        placeholder={placeholder}
        {...register(name)}
        name={name}
        id={name}
        onInput={handleInput}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${
          errors[name] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : "focus:ring-blue-500 focus:border-blue-500"
        }`}
      />
      <div className="min-h-[1.25rem] mt-1 text-sm text-red-600 transition-opacity duration-300">
        {errors[name]?.message ?? <span className="invisible">Placeholder</span>}
      </div>
    </div>
  );
}

export default ValidatedCodeInput;
