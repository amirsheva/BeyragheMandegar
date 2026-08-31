import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";


const PREFIX =
  "enc:v1";

const AAD =
  Buffer.from(
    "beyragh-mandegar:pii:v1",
    "utf8"
  );


function encryptionEnabled() {
  return (
    String(
      process.env
        .PII_ENCRYPTION_ENABLED ||
        "false"
    )
      .trim()
      .toLowerCase() ===
    "true"
  );
}


function readKey({
  required = false,
} = {}) {
  const encoded =
    String(
      process.env
        .PII_ENCRYPTION_KEY ||
        ""
    ).trim();


  if (!encoded) {
    if (required) {
      throw new Error(
        "PII_ENCRYPTION_KEY is missing."
      );
    }

    return null;
  }


  let key;

  try {
    key =
      Buffer.from(
        encoded,
        "base64"
      );
  } catch {
    throw new Error(
      "PII_ENCRYPTION_KEY is not valid Base64."
    );
  }


  if (
    key.length !==
    32
  ) {
    throw new Error(
      "PII_ENCRYPTION_KEY must decode to exactly 32 bytes."
    );
  }


  return key;
}


export function isPiiEncryptionEnabled() {
  return encryptionEnabled();
}


export function isEncryptedPii(
  value
) {
  return String(
    value ?? ""
  ).startsWith(
    `${PREFIX}:`
  );
}


export function assertPiiEncryptionConfigured() {
  if (
    !encryptionEnabled()
  ) {
    throw new Error(
      "PII encryption is not enabled."
    );
  }

  readKey({
    required:
      true,
  });

  return true;
}


export function encryptPii(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }


  const plainText =
    String(value);


  if (
    isEncryptedPii(
      plainText
    )
  ) {
    return plainText;
  }


  if (
    !encryptionEnabled()
  ) {
    return plainText;
  }


  const key =
    readKey({
      required:
        true,
    });


  const iv =
    randomBytes(
      12
    );


  const cipher =
    createCipheriv(
      "aes-256-gcm",
      key,
      iv
    );


  cipher.setAAD(
    AAD
  );


  const encrypted =
    Buffer.concat([
      cipher.update(
        plainText,
        "utf8"
      ),

      cipher.final(),
    ]);


  const tag =
    cipher.getAuthTag();


  return [
    PREFIX,

    iv.toString(
      "base64url"
    ),

    tag.toString(
      "base64url"
    ),

    encrypted.toString(
      "base64url"
    ),
  ].join(":");
}


export function decryptPii(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }


  const stored =
    String(value);


  if (
    !isEncryptedPii(
      stored
    )
  ) {
    return stored;
  }


  const key =
    readKey({
      required:
        true,
    });


  const parts =
    stored.split(":");


  if (
    parts.length !==
      5 ||
    parts[0] !==
      "enc" ||
    parts[1] !==
      "v1"
  ) {
    throw new Error(
      "Invalid encrypted PII format."
    );
  }


  const iv =
    Buffer.from(
      parts[2],
      "base64url"
    );

  const tag =
    Buffer.from(
      parts[3],
      "base64url"
    );

  const encrypted =
    Buffer.from(
      parts[4],
      "base64url"
    );


  if (
    iv.length !==
    12
  ) {
    throw new Error(
      "Invalid encrypted PII IV."
    );
  }


  if (
    tag.length !==
    16
  ) {
    throw new Error(
      "Invalid encrypted PII auth tag."
    );
  }


  const decipher =
    createDecipheriv(
      "aes-256-gcm",
      key,
      iv
    );


  decipher.setAAD(
    AAD
  );

  decipher.setAuthTag(
    tag
  );


  const decrypted =
    Buffer.concat([
      decipher.update(
        encrypted
      ),

      decipher.final(),
    ]);


  return decrypted.toString(
    "utf8"
  );
}