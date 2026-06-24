export const formatInputValue = (value) => {
    if (value === "" || value === "-" || value.endsWith(".")) {
        return value;
    }
    const num = parseFloat(value);
    return isNaN(num) ? "" : num;
};


export const formatInputZeta = (value) => {
    if (value === "" || value === "-" || value.endsWith(".")) {
        return value;
    }
    let num = parseFloat(value);
    if (isNaN(num)) return "0";
    num = Math.min(1, Math.max(0, num));
    num = Math.round(num * 100) / 100;
    return num;
};