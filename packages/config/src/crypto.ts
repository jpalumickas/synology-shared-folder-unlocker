import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
} from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 32
const PBKDF2_ITERATIONS = 600_000

interface EncryptedData {
  salt: string
  iv: string
  data: string
  tag: string
  verifyIv: string
  verifyData: string
  verifyTag: string
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
}

function encrypt(plaintext: string, password: string): EncryptedData {
  const salt = randomBytes(SALT_LENGTH)
  const key = deriveKey(password, salt)

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  const verifyIv = randomBytes(IV_LENGTH)
  const verifyCipher = createCipheriv(ALGORITHM, key, verifyIv)
  const verifyEncrypted = Buffer.concat([
    verifyCipher.update('synology-shared-folder-unlocker-verify', 'utf8'),
    verifyCipher.final(),
  ])
  const verifyTag = verifyCipher.getAuthTag()

  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    tag: tag.toString('hex'),
    verifyIv: verifyIv.toString('hex'),
    verifyData: verifyEncrypted.toString('hex'),
    verifyTag: verifyTag.toString('hex'),
  }
}

function decrypt(enc: EncryptedData, password: string): string {
  const salt = Buffer.from(enc.salt, 'hex')
  const key = deriveKey(password, salt)
  const iv = Buffer.from(enc.iv, 'hex')
  const tag = Buffer.from(enc.tag, 'hex')
  const data = Buffer.from(enc.data, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return decipher.update(data).toString('utf8') + decipher.final('utf8')
}

const DEFAULT_DATA_DIR = join(
  homedir(),
  '.config',
  'synology-shared-folder-unlocker'
)
const DATA_DIR = process.env.DATA_PATH || DEFAULT_DATA_DIR
const CONFIG_PATH = join(DATA_DIR, 'config.enc')

export async function configExists(): Promise<boolean> {
  return existsSync(CONFIG_PATH)
}

export async function saveConfig(
  config: object,
  password: string
): Promise<void> {
  const dir = dirname(CONFIG_PATH)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  const encrypted = encrypt(JSON.stringify(config), password)
  await writeFile(CONFIG_PATH, JSON.stringify(encrypted, null, 2), 'utf8')
}

export async function loadConfig(password: string): Promise<object> {
  const raw = await readFile(CONFIG_PATH, 'utf8')
  const encrypted: EncryptedData = JSON.parse(raw)
  const decrypted = decrypt(encrypted, password)
  return JSON.parse(decrypted)
}

export async function verifyConfigPassword(password: string): Promise<boolean> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8')
    const enc: EncryptedData = JSON.parse(raw)
    const salt = Buffer.from(enc.salt, 'hex')
    const key = deriveKey(password, salt)
    const iv = Buffer.from(enc.verifyIv, 'hex')
    const tag = Buffer.from(enc.verifyTag, 'hex')
    const data = Buffer.from(enc.verifyData, 'hex')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    const result =
      decipher.update(data).toString('utf8') + decipher.final('utf8')

    return result === 'synology-shared-folder-unlocker-verify'
  } catch {
    return false
  }
}
