export function generatePatientNumber() {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 90 + 10) // 2桁のランダム値
  return `P${timestamp}${random}`
}
