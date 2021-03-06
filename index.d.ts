export interface ThrottleFunction<I> {
    (context: I, duration?: number): Promise<boolean>;
    (context: I, cb: (err: Error, pass: boolean) => void): void;
    (context: I, duration: number, cb: (err: Error, pass: boolean) => void): void;
}

export interface ThrottleStorage {
    /** Sets a throttle record in the storage. */
    set(id: string, duration: number, cb: (err: Error) => void): void;
    /** Tests the throttle via id to see if an operation can be performed. */
    test(id: string, cb: (err: Error, pass: boolean) => void): void;
    /** Garbage collection implementation. */
    gc(cb: () => void): void;
}

export class CommonStore implements ThrottleStorage {
    protected records?: { [x: string]: [number, number] };
    constructor(records?: { [x: string]: [number, number] });
    set(id: string, duration: number, cb: (err: Error) => void): void;
    test(id: string, cb: (err: Error, pass: boolean) => void): void;
    gc(cb: () => void): void;
}

export interface ThrottleOptions<I> {
    /**
     * The default duration in seconds to lock between two operations, the 
     * default value is `5`.
     */
    duration?: number;
    /**
     * Uses a property (or several properties) from the context object to 
     * produce hash id for storing throttle records. If no key is provided, 
     * the hash id will be generated according to the context itself.
     */
    useKey?: keyof I | Array<keyof I> | string[];
    /**
     * The throttle rule will not be applied to the matching condition, returns 
     * `true` or `false` to indicate skipping or testing.
     */
    except?: (context: I) => boolean;
    /**
     * Garbage collection interval in seconds, expired throttle records will be 
     * deleted after timeout. The default value is 15, and you can set `0` to 
     * disable GC.
     */
    gcInterval?: number;
    /**
     * Uses a customized storage implementation to store throttle records. By 
     * default, records are stored in memory.
     */
    storage?: ThrottleStorage
}

/** Creates a throttle function. */
export function createThrottle<I = any>(options: ThrottleOptions<I>): ThrottleFunction<I>;

export namespace createThrottle {
    /** Creates a Express middleware. */
    function express<I, O>(options: ThrottleOptions<I> & {
        /**
         * If a new request happens when the throttle is locked, throw a message
         * to the client. If an array is provided, it contains an HTTP status 
         * code and a message; if a function is provided, you're able to handle 
         * and send the response yourself. The default value is 
         * `[429, 'Too Many Requests']`.
         */
        throw?: [number, string] | ((req: I, res: O) => void);
    }): (duration?: number) => (req: I, res: O, next: () => void) => void;

    /** Creates a Koa middleware. */
    function koa<I>(options: ThrottleOptions<I> & {
        /**
         * If a new request happens when the throttle is locked, throw a message
         * to the client. If an array is provided, it contains an HTTP status 
         * code and a message; if a function is provided, you're able to handle 
         * and send the response yourself. The default value is 
         * `[429, 'Too Many Requests']`.
         */
        throw?: [number, string] | ((ctx: I) => void);
    }): (duration?: number) => (ctx: I, next: () => any) => Promise<void>;
}

export default createThrottle;