import { useFormContext } from "react-hook-form";

function ValidateRadioGroup({ name, option = []}) {
    const {register, formState: {errors}, setValue, watch} = useFormContext();
    const current = watch(name);
    const reg = register(name);

    return (
        <div className="w-full md:w-[48%]  mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Facture annulée ?</span>
            <div className="flex gap-4">
                {option.map((e, i) => {
                    const val = e.value ?? e.name;
                    const checked = current ? current === val : val === 'Non';
                    return (
                        <label htmlFor={e.name} className="inline-flex items-center gap-2" key={i}>
                            <input
                                type="radio"
                                id={e.name}
                                value={val}
                                checked={checked}
                                onChange={(evt) => {
                                    reg.onChange(evt);
                                    setValue(name, val, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                                }}
                                name={reg.name}
                                ref={reg.ref}
                                className={`text-blue-600 focus:ring-blue-500 ${errors[name] ? "border-red-700 focus:ring-red-500" : "border-blue-500"}`}
                            />
                            <span>{e.name}</span>
                        </label>
                    );
                })}
                {errors[name] && (
                    <p className="text-red-600 font-sm mt-1 transition-opacity duration-300">{errors[name].message}</p>
                )}
            </div>
        </div>
    )
}

export default ValidateRadioGroup;