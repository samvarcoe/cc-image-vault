declare global {
    interface Window {
        MODEL_DATA: string;
    }
}

type FocusState = {
    id: string | null;
    start: number | null;
    end: number | null;
};