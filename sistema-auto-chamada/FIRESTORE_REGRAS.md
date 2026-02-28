# Firebase: Regras do Firestore e Autenticação

## Login com e-mail e senha

Para o login e a criação de conta funcionarem, é preciso ativar o **método de acesso por E-mail/senha** no Firebase:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/) → projeto **sistema-auto-chamada**.
2. No menu lateral: **Authentication** (Autenticação) → aba **Sign-in method**.
3. Clique em **E-mail/senha**, ative a opção e salve.

---

# Regras do Firestore para o Sistema de Auto-chamada

Se ao **confirmar presença** aparecer erro de **permissão** ou **Permission denied**, é porque o Firestore está bloqueando leitura/escrita. Siga os passos abaixo.

## Onde configurar

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione o projeto **sistema-auto-chamada**.
3. No menu lateral: **Firestore Database** → aba **Regras** (Rules).

## Regras para colar

Cole as regras abaixo (elas liberam leitura e escrita nas coleções usadas pelo app, em modo de **teste**; em produção você deve restringir por usuário autenticado).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
    match /courses/{courseId} {
      allow read, write: if true;
    }
    match /classes/{classId} {
      allow read, write: if true;
    }
    match /attendances/{attendanceId} {
      allow read, write: if true;
    }
  }
}
```

4. Clique em **Publicar** (Publish).
5. Tente **confirmar presença** de novo no site.

Depois de publicar, a confirmação de presença deve funcionar.
