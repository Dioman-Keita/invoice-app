import { useFormContext } from "react-hook-form";
import useTostFeedBack from "../hooks/useToastFeedBack";

function ValidateDateInput({ label, placeholder, name, type="text"}) {
    const {register, formState: {errors}, setValue} = useFormContext();
    const {error} = useTostFeedBack();
    const handleInput = (e) => {

        const raw = e.target.value.replace(/\D/g, '');
        if (raw.length > 8) error("Format JJ/MM/AAAA — 8 chiffres max");
        const digits = raw.slice(0, 8);
        const dd = digits.slice(0, 2) 
        const mm = digits.slice(2, 4);
        const yyyy = digits.slice(4, 8);
        let formatted = dd;
        if (mm) formatted += '/' + mm;
        if (yyyy) formatted += '/' + yyyy;
        e.target.value = formatted;
        setValue(name, formatted);
    };

    const handleBlur = (e) => {
        const m = e.target.value.match(/^(\d{1,2})(?:\/(\d{1,2}))?(?:\/(\d{2,4}))?$/);
        if (!m) return;
        let [, d, mth, y] = m;
        if (d) d = d.padStart(2, '0');
        if (mth) mth = mth.padStart(2, '0');
        if (y && y.length === 2) y = (parseInt(y, 10) >= 70 ? '19' : '20') + y;
        const parts = [d, mth, y].filter(Boolean);
        e.target.value = parts.join('/');
        setValue(name, e.target.value);
    };
    return (
        <div className="w-full md:w-[48%] mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>{label}</label>
            <input type={type} placeholder={placeholder} {...register(name)} id={name} onInput={handleInput} onBlur={handleBlur} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${errors[name] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : "focus:ring-blue-500 focus:border-blue-500"}`} />
            {errors[name] && (
                <p className="text-red-600 font-sm mt-1 transition-opacity duration-300">{errors[name].message}</p>
            )}
        </div>
    )
}

export default ValidateDateInput;