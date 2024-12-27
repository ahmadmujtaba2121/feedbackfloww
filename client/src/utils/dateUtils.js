export const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
    }
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return !isNaN(date.getTime()) ? date.toLocaleString() : 'Never';
    }
    return 'Never';
}; 