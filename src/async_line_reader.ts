import * as Bluebird from 'bluebird'
import * as readline from "readline"

export class None { }

export default class AsyncLineReader {
    MAX_PENDING_BYTES = 64000

    rl: readline.ReadLine
    closed = false
    private _pendingStringBytes = 0
    private _lineQueue: string[] = []
    private _lineRequests: Bluebird.Resolver<string | None>[] = []

    constructor(opts: readline.ReadLineOptions) {
        opts.input.on('error', this.handleError)
        this.rl = readline.createInterface(opts)
            .on('line', this.handleLine)
            .on('close', this.handleClose)
    }

    private handleError = (error: any) => {
        this._lineRequests.forEach((lr) => {
            console.log("Error upstream", error)
            lr.reject(error)
        })
    }


    private handleClose = () => {
        this.closed = true
        // Drain the line queue into requests
        this._lineRequests.forEach((lr) => {
            let line = this.dequeueLine()
            if (line) {
                lr.resolve(line)
            } else {
                lr.resolve(new None())
            }
        })
    }

    private handleLine = (line: string) => {
        if (this._lineRequests.length == 0) {
            // Queue the line for next getLine() call
            this._lineQueue.push(line)
            // Account towards pending bytes
            this._pendingStringBytes += line.length
            // Create back-pressure
            if (this._pendingStringBytes >= this.MAX_PENDING_BYTES) { this.rl.pause() }
        } else {
            // Pull one of the waiting requests
            let deferred = this._lineRequests.shift()
            if (deferred) { deferred.resolve(line) }
        }
    }

    private dequeueLine(): string | null {
        let line = this._lineQueue.shift()
        if (line) {
            this._pendingStringBytes -= line.length
            if (this._pendingStringBytes < this.MAX_PENDING_BYTES) { this.rl.resume() }
            return line
        }
        return null
    }

    getLine(): Bluebird<string | None> {
        let line = this.dequeueLine()
        if (line) {
            return Bluebird.resolve(line)
        } else {
            let deferred = Bluebird.defer<string>()
            if (this.closed) { return Bluebird.resolve(new None) }
            this._lineRequests.push(deferred)
            return deferred.promise
        }
    }
}

