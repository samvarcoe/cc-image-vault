declare global {
    interface Window {
        MODEL_DATA: string;
    }
}

export type FocusState = {
    id: string | null;
    start: number | null;
    end: number | null;
};