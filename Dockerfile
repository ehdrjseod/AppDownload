# Node.js 공식 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 애플리케이션 소스 복사
COPY . .

# 업로드 디렉토리 생성
RUN mkdir -p uploads/android uploads/ios

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["npm", "start"]

