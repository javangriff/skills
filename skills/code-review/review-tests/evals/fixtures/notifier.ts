export type MessageGateway = {
  send(recipient: string, body: string): Promise<void>
}

export async function notifyPasswordReset(
  gateway: MessageGateway,
  recipient: string,
  resetUrl: string,
): Promise<void> {
  await gateway.send(recipient, `Reset your password: ${resetUrl}`)
}
