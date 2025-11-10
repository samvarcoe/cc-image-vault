export const validateCollectionName = (name) => {
    if (!name.trim()) {
        throw new Error('Collection name cannot be empty');
    }
    if (name.length > 256) {
        throw new Error(`"${name}" is not a valid Collection name`);
    }
    const validNamePattern = /^[a-zA-Z0-9-]+$/;
    if (!validNamePattern.test(name)) {
        throw new Error(`"${name}" is not a valid Collection name`);
    }
};
