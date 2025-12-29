import { Body, Button, Container, Head, Html, Preview, Text } from '@react-email/components';
import React from 'react';
import { Temporal } from 'temporal-polyfill';

type Props = {
  origin: string;
  email: string;
  code: string;
  verificationId: string;
  expiresAt: Temporal.Instant;
};

const Email = ({ origin, email, code, verificationId, expiresAt }: Props) => {
  const formatted = expiresAt.toZonedDateTimeISO('Asia/Seoul').toLocaleString();

  return (
    <Html lang="ko">
      <Head />
      <Preview>인증번호 {code}</Preview>
      <Body>
        <Container>
          <Text>별마루에 {email} 이메일로 신규 가입하려고 해요.</Text>
          <Button
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 12,
              fontWeight: 600,
              borderRadius: 8,
              textAlign: 'center',
              backgroundColor: 'rgb(79,70,229)',
              color: 'rgb(255,255,255)',
            }}
            href={`${origin}/auth/email?verificationId=${verificationId}&code=${code}`}
          >
            가입하기
          </Button>
          <Text>가입하려면 위 버튼을 누르거나 인증번호 {code} 를 입력해주세요.</Text>
          <Text>인증은 {formatted} 까지 유효합니다.</Text>
        </Container>
      </Body>
    </Html>
  );
};

Email.PreviewProps = {
  origin: 'http://localhost:5173',
  email: 'byulmaru@example.com',
  code: '12345678',
  verificationId: 'asdf',
  expiresAt: Temporal.Now.instant().add({ minutes: 10 }),
} satisfies Props;

export default Email;
