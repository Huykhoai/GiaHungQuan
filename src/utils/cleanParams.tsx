export const cleanParams = (params: any) => {
    const result: any = {};
    Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined && value.toString().trim() !== "") {
            result[key] = value;
        }
    })
    return result;
}