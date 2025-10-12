import React from "react";
import { Box, H2, Text, Illustration, Button } from "@adminjs/design-system";

const Dashboard = () => {
  return (
    <Box
      variant="white"
      p="xl"
      style={{
        direction: "rtl",
        textAlign: "right",
      }}
    >
      <H2 color="primary100">🎛 داشبورد مدیریتی بیرق ماندگار</H2>
      <Text mt="lg" fontSize={16}>
        به پنل مدیریت بیرق ماندگار خوش آمدید.
      </Text>
      <Text mt="md" opacity={0.8}>
        از منوی سمت راست می‌توانید محتوای سایت، کاربران و تنظیمات را مدیریت کنید.
      </Text>

      <Box
        mt="xl"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexDirection="row"
        flexWrap="wrap"
        gap="lg"
      >
        <Illustration variant="Rocket" width={120} />
        <Box flex="1">
          <Text mb="md">
            برای شروع، یکی از بخش‌های منو را انتخاب کنید یا روی دکمه زیر بزنید تا به مدیریت اجراها بروید.
          </Text>
          <Button as="a" href="/admin/resources/shows" variant="primary">
            مدیریت اجراها
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;