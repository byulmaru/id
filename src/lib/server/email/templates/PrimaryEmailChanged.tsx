import { Body, Container, Head, Html, Text } from '@react-email/components';
import React from 'react';

type Props = {
  name: string;
  email: string;
};

const Email = ({ name, email }: Props) => {
  return (
    <Html lang="ko">
      <Head />
      <Body>
        <Container>
          <Text>안녕하세요, {name}님.</Text>
          <Text>별마루 계정의 주 이메일이 {email} 로 변경되었어요.</Text>
          <Text>혹시 직접 변경하신 것이 아니라면, 도움센터에 문의해 주세요.</Text>
        </Container>
      </Body>
    </Html>
  );
};

Email.PreviewProps = {
  name: '테스트',
  email: 'newemail@example.com',
} satisfies Props;

export default Email;
