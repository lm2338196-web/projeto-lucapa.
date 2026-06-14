/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração fornecida diretamente pelo usuário para conexão real
export const firebaseConfig = {
  apiKey: "AIzaSyBJ9g8HbXT71H-xVCdbSRIVGutxWyt45z0",
  authDomain: "zenite-16957.firebaseapp.com",
  projectId: "zenite-16957",
  storageBucket: "zenite-16957.firebasestorage.app",
  messagingSenderId: "43336767623",
  appId: "1:43336767623:web:8210edb32750e38a9d8022"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enum de operações para o erro Firestore
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

/**
 * Captura e formata erros do Firestore de acordo com as diretrizes do Skill.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error("Erro Firestore:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
