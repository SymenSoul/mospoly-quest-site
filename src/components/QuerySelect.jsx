// Выпадающий список с подписью. options — строки или объекты { value, label }
export default function QuerySelect({ label, value, options, onChange, placeholder }) {
  return (
    <label className="query-part">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => {
          const { value: optionValue, label: optionLabel } =
            typeof option === 'string' ? { value: option, label: option } : option;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}
