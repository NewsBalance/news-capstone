# News Balance Frontend

News Balance는 온라인 동영상과 뉴스를 분석해 정치적 편향을 시각화하는 웹 애플리케이션입니다. 주요 기능은 다음과 같습니다.

* **동영상 검색 및 분류** – YouTube API를 사용해 영상을 검색하고 제목과 자막을 기반으로 좌/우/중도 편향을 단순 분류합니다.
* **세부 분석 페이지** – 각 영상의 메타데이터와 자막 요약·감성 분석 결과를 확인할 수 있습니다.
* **마이페이지 대시보드** – 시청 편향 통계, 활동 기록 및 계정 설정을 관리합니다.

이 프로젝트는 [Create React App](https://github.com/facebook/create-react-app)으로 부트스트랩 되었습니다.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## 환경 변수 설정

YouTube API를 사용하려면 `.env` 파일에 API 키를 지정해야 합니다. 프로젝트 루트에 다음과 같이 작성하세요.

```env
REACT_APP_YT_API_KEY=<YOUR_KEY>
# Vite를 사용하는 경우
# VITE_YT_API_KEY=<YOUR_KEY>
```

키가 없으면 동영상 검색 기능이 동작하지 않으며, 검색 결과와 상세 페이지 로딩에 모두 사용됩니다.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Configuring API URL

The application expects an API server base URL provided via the
`REACT_APP_API_URL` environment variable. Create a `.env` file in the project
root and set the variable:

```bash
REACT_APP_API_URL=https://api.example.com
```

During development this file will be loaded automatically. For production make
sure the variable is defined in the environment before starting the app.

## Local Setup

1. 의존성 설치
   ```bash
   npm install
   ```
2. 프로젝트 루트에 `.env` 파일을 생성해 위에서 설명한 환경 변수를 설정합니다.
3. 개발 서버 실행
   ```bash
   npm start
   ```
4. 테스트 실행
   ```bash
   npm test
   ```
5. 프로덕션 빌드 생성
   ```bash
   npm run build
   ```

백엔드 API가 필요합니다. `REACT_APP_API_URL`에 지정한 주소에서 서버를 실행하거나
별도의 [News Balance Backend](https://github.com/your-org/newsbalance-backend)
저장소를 참고하세요.
