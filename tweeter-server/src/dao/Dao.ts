export interface Dao<T, KeyArgs extends unknown[]> {
    putItem(item: T): Promise<void>;
    getItem(...args: KeyArgs): Promise<T | undefined>;
    deleteItem(...args: KeyArgs): Promise<void>;
}