$env:OPENAI_API_KEY="0e420f1b-15e6-47d2-adf3-ef8987c1a9ca"  #api密钥
$env:OPENAI_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
$env:VOLC_RAW="1"        # 开启直连 /responses
后端（Java/Spring Boot）：
 cd backend
 mvn spring-boot:run

前端（Vite + React）：
npm install
npm run dev