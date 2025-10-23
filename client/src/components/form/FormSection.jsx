function FormSection({ children, legend }) {
    return (
      <fieldset className="mb-6 flex flex-wrap gap-4">
        {legend && <legend className="text-lg font-semibold mb-2">{legend}</legend>}
        {children}
      </fieldset>
    );
  }
  
  export default FormSection;
  