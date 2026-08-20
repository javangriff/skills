// This is the rate limiter class
export class RateLimiter {
  // the maximum number of tokens
  private maxTokens: number
  // the current number of tokens available
  private tokens: number
  // the timestamp of the last refill
  private lastRefill: number
  // the rate at which tokens are added per second
  private refillRate: number

  // the constructor
  constructor(maxTokens: number, refillRate: number) {
    // set the max tokens
    this.maxTokens = maxTokens
    // set the tokens to the max tokens
    this.tokens = maxTokens
    // set the refill rate
    this.refillRate = refillRate
    // set the last refill to now
    this.lastRefill = Date.now()
  }

  // this method tries to consume a token and returns true if it could
  tryAcquire(): boolean {
    // first we refill the tokens based on elapsed time
    this.refill()
    // check if we have at least one token
    if (this.tokens >= 1) {
      // decrement the token count
      this.tokens -= 1
      // return true because we got a token
      return true
    }
    // otherwise return false
    return false
  }

  // refill the tokens
  private refill() {
    // get the current time
    const now = Date.now()
    // We cap at maxTokens so a long idle period can't accumulate unlimited burst
    // capacity, which would let a caller blow straight past the limit after going quiet.
    const elapsed = (now - this.lastRefill) / 1000
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate)
    // update the last refill timestamp
    this.lastRefill = now
  }
}
