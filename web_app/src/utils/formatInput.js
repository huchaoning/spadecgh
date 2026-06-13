export const formatInputValue = (value) => {
    if (value === "" || value === "-" || value.endsWith(".")) {
        return value;
    }
    const num = parseFloat(value);
    return isNaN(num) ? "" : num;
};