
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

export async function generateStudentDraft(
  studentName: string,
  studentNumber: string,
  observations: string[],
  charLimit: number,
  extraContext?: string
): Promise<string> {
  if (!observations || observations.length === 0) {
    throw new Error("선택된 관찰 기록이 없습니다.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
대한민국 학교의 베테랑 교사로서 다음 학생의 관찰 기록을 바탕으로 생활기록부용 문장을 작성하세요.

[학생 정보]
- 이름: ${studentName}
- 학번: ${studentNumber}

[선택된 관찰 기록]
${observations.map((o, i) => `${i + 1}. ${o}`).join('\n')}

${extraContext ? `[추가 반영 요청 사항]\n${extraContext}\n` : ''}

[작성 지침]
1. 분량: 공백 포함 약 ${charLimit}자 내외로 작성할 것.
2. 문체: '~함', '~임', '~함'과 같은 개조식/평어체 종결 어미 사용.
3. 내용: 기록된 사실을 바탕으로 학생의 역량과 성장이 드러나도록 유기적으로 연결할 것.
4. 주의: 주관적인 감정 표현이나 과장된 수식어는 배제하고 객관적 사실 위주로 서술할 것.

최종 문장 본문만 출력하세요. 인사말이나 설명은 생략합니다.
`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });

    const resultText = response.text;
    
    if (!resultText) {
      throw new Error("AI가 내용을 생성하지 못했습니다. (안전 필터에 의해 차단되었을 수 있습니다)");
    }
    
    return resultText.trim();
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error("API 키가 유효하지 않습니다.");
    }
    throw new Error(`AI 호출 실패: ${error.message || '네트워크 상태를 확인해주세요.'}`);
  }
}
