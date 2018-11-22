export interface ThrottleFunction<I> {
    (context: I, duration?: number): Promise<boolean>;
    (context: I, cb: (err: Error, pass: boolean) => void): void;
    (context: I, duration: number, cb: (err: Error, pass: boolean) => void): void;
}

export interface ThrottleStorage {
    /** Sets a throttle record in the storage. */
    set(id: string, duration: number, cb: (err: Error) => void): void;
    /** Tests if a throttle is available. */
    test(id: string, cb: (err: Error, pass: boolean) => void): void;
    /** Garbage collection implementation. */
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
     * populate hash id for storing throttle records.
     */
    useKey?: keyof I | Array<keyof I>;
    /**
     * The throttle rule will not be applied to the matching condition, returns 
     * `true` or `false` to indicate skipping or testing.
     */
    except?: (context: I) => boolean;
    /**
     * Garbage collection interval in seconds, expired throttle records will be 
     * deleted after timeout.
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