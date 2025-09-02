import { useFormContext } from "react-hook-form";

function ValidateSelectInput({ name, option = [], label}) {
    const {register, formState:{errors}} = useFormContext();
    return (
        <div className="w-full md:w-[48%] mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <select name={name} id={name} {...register(name)} className={`w-full px-3 py-2 border  border-gray-300 rounded-sm focus:outline-none focus:ring-blue-500 ${errors[name] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}>
                    {option.map((e, i) => (
                        <option key={i} value={e.value || e.name}>{e.name}</option>
                    ))}
                </select>
                {errors[name] && (
                    <p className="text-red-600 text-sm mt-1 transition-opacity duration-300">{errors[name].message}</p>
                )}
        </div>
    )
}

export default ValidateSelectInput;