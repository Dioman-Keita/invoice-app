import { useFormContext } from "react-hook-form";
function ValidateCheckboxGroup({option,  name}) {
    const {formState: {errors}, register} = useFormContext();
    return (
        <div className="w-full md:w-[48%]">
            <h4 className="mb-4 text-lg font-semibold text-gray-800">Documents joints à la facture</h4>
            {option.map((e, i) => (
                <label 
                    key={i}
                    className="flex item-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
                >
                    <input 
                        type="checkbox" 
                        value={e.value || e.name} 
                        {...register(name)} 
                        className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${errors[name] ? "focus:ring-red-500 border-red-500" : "focus:ring-blue-500"}`}/>
                        <span>{e.value}</span>
                </label>
            ))}
            {errors[name]?.lenght > 0 && (
                    <p className="text-red-600 text-sm mt-1 transition-opacity duration-300">{errors[name].message}</p>
            )}
        </div>
    )
}

export default ValidateCheckboxGroup;