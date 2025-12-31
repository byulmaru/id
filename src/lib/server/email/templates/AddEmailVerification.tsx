import { Body, Button, Container, Head, Html, Preview, Text } from '@react-email/components';
import React from 'react';
import { Temporal } from 'temporal-polyfill';

type Props = {
  name: string;
  email: string;
  code: string;
  expiresAt: Temporal.Instant;
};

const Email = ({ name, email, code, expiresAt }: Props) => {
  const formatted = expiresAt.toZonedDateTimeISO('Asia/Seoul').toLocaleString();

  return (
    <Html lang="ko">
      <Head />
      <Body>
        <Container>
          <Text>안녕하세요, {name}님.</Text>
          <Text>별마루 계정에 {email} 이메일을 추가하려고 해요.</Text>
          <Text>이메일을 인증하려면 인증번호 {code} 를 입력해주세요.</Text>
          <Text>인증은 {formatted} 까지 유효합니다.</Text>
        </Container>
      </Body>
    </Html>
  );
};

Email.PreviewProps = {
  name: '테스트',
  email: 'newemail@example.com',
  code: '123456',
  expiresAt: Temporal.Now.instant().add({ hours: 24 }),
} satisfies Props;

export default Email;
