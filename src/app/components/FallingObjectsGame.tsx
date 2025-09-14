"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

interface GameState {
  점수: number;
  게임시작: boolean;
  게임오버: boolean;
}

const FallingObjectsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const fallingObjectsRef = useRef<Matter.Body[]>([]);

  const [게임상태, set게임상태] = useState<GameState>({
    점수: 0,
    게임시작: false,
    게임오버: false,
  });

  // 게임 초기화 함수
  const 게임초기화 = () => {
    if (!canvasRef.current) return;

    // Matter.js 엔진 생성
    const engine = Matter.Engine.create();
    const world = engine.world;
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: "#87CEEB", // 하늘색 배경
        showAngleIndicator: false,
        showVelocity: false,
        showCollisions: false,
        showDebug: false,
      },
    });

    // 중력 설정 (물체가 아래로 떨어지도록) - 속도 감소
    engine.world.gravity.y = 0.3;

    // 바닥 생성 (화면 하단에 보이지 않는 벽)
    const 바닥 = Matter.Bodies.rectangle(400, 620, 800, 40, {
      isStatic: true,
      render: { visible: false },
    });

    // 좌우 벽 생성 (화면 밖에 보이지 않는 벽)
    const 왼쪽벽 = Matter.Bodies.rectangle(-20, 300, 40, 600, {
      isStatic: true,
      render: { visible: false },
    });
    const 오른쪽벽 = Matter.Bodies.rectangle(820, 300, 40, 600, {
      isStatic: true,
      render: { visible: false },
    });

    // 월드에 바닥과 벽 추가
    Matter.World.add(world, [바닥, 왼쪽벽, 오른쪽벽]);

    // 렌더러 시작
    Matter.Render.run(render);

    // 엔진 실행
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // 참조 저장
    engineRef.current = engine;
    renderRef.current = render;
    worldRef.current = world;

    // 물체가 바닥에 떨어졌을 때 제거하는 이벤트 리스너
    Matter.Events.on(engine, "collisionStart", event => {
      const pairs = event.pairs;

      pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        // 떨어지는 물체가 바닥에 닿았을 때
        if (
          (bodyA === 바닥 && fallingObjectsRef.current.includes(bodyB)) ||
          (bodyB === 바닥 && fallingObjectsRef.current.includes(bodyA))
        ) {
          const 떨어지는물체 = bodyA === 바닥 ? bodyB : bodyA;

          // 물체 제거
          Matter.World.remove(world, 떨어지는물체);
          fallingObjectsRef.current = fallingObjectsRef.current.filter(
            obj => obj !== 떨어지는물체
          );

          // 게임 오버 처리
          set게임상태(prev => ({ ...prev, 게임오버: true }));
        }
      });
    });
  };

  // 랜덤한 위치에서 떨어지는 물체 생성 함수
  const 떨어지는물체생성 = () => {
    if (!worldRef.current) return;

    // 한번에 생성할 물체 개수 (1~3개 랜덤)
    const 생성할물체개수 = Math.floor(Math.random() * 3) + 1; // 1~3개

    // 물체 색상 배열
    const 색상들 = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
    ];

    // 여러 물체 생성
    for (let i = 0; i < 생성할물체개수; i++) {
      // 랜덤한 x 위치 (화면 너비 내에서)
      const 랜덤X위치 = Math.random() * 700 + 50; // 50~750 사이

      // 물체 크기 랜덤 (20~40 픽셀)
      const 물체크기 = Math.random() * 20 + 20;

      // 물체 색상 랜덤
      const 랜덤색상 = 색상들[Math.floor(Math.random() * 색상들.length)];

      // 물체 생성
      const 떨어지는물체 = Matter.Bodies.circle(랜덤X위치, -50, 물체크기, {
        restitution: 0.3, // 탄성
        friction: 0.1, // 마찰
        render: {
          fillStyle: 랜덤색상,
          strokeStyle: "#333",
          lineWidth: 2,
        },
      });

      // 월드에 물체 추가
      Matter.World.add(worldRef.current, 떨어지는물체);
      fallingObjectsRef.current.push(떨어지는물체);
    }
  };

  // 물체 클릭 처리 함수
  const 물체클릭처리 = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!renderRef.current || !worldRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 클릭한 위치의 물체 찾기
    const clickedBody = fallingObjectsRef.current.find(body => {
      const distance = Math.sqrt(
        Math.pow(body.position.x - mouseX, 2) +
          Math.pow(body.position.y - mouseY, 2)
      );
      return distance <= body.circleRadius! + 25; // 클릭 허용 범위 확대
    });

    if (clickedBody) {
      // 물체 제거
      Matter.World.remove(worldRef.current, clickedBody);
      fallingObjectsRef.current = fallingObjectsRef.current.filter(
        obj => obj !== clickedBody
      );

      // 점수 증가
      set게임상태(prev => ({ ...prev, 점수: prev.점수 + 10 }));
    }
  };

  // 게임 시작 함수
  const 게임시작 = () => {
    set게임상태({
      점수: 0,
      게임시작: true,
      게임오버: false,
    });

    // 기존 물체들 제거
    if (worldRef.current) {
      fallingObjectsRef.current.forEach(body => {
        Matter.World.remove(worldRef.current!, body);
      });
      fallingObjectsRef.current = [];
    }
  };

  // 게임 리셋 함수
  const 게임리셋 = () => {
    set게임상태({
      점수: 0,
      게임시작: false,
      게임오버: false,
    });

    // 기존 물체들 제거
    if (worldRef.current) {
      fallingObjectsRef.current.forEach(body => {
        Matter.World.remove(worldRef.current!, body);
      });
      fallingObjectsRef.current = [];
    }
  };

  // 컴포넌트 마운트 시 게임 초기화
  useEffect(() => {
    게임초기화();

    return () => {
      // 정리 작업
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
      }
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, []);

  // 게임이 시작되면 주기적으로 물체 생성
  useEffect(() => {
    if (!게임상태.게임시작 || 게임상태.게임오버) return;

    const 물체생성간격 = setInterval(() => {
      떨어지는물체생성();
    }, 2000); // 2초마다 물체 생성 (더 여유롭게)

    return () => clearInterval(물체생성간격);
  }, [게임상태.게임시작, 게임상태.게임오버]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
          떨어지는 물체 맞추기 게임
        </h1>

        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-semibold text-gray-700">
            점수: {게임상태.점수}
          </div>

          <div className="flex gap-2">
            {!게임상태.게임시작 && !게임상태.게임오버 && (
              <button
                onClick={게임시작}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                게임 시작
              </button>
            )}

            {게임상태.게임오버 && (
              <button
                onClick={게임리셋}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                다시 시작
              </button>
            )}
          </div>
        </div>

        {게임상태.게임오버 && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-600 mb-2">게임 오버!</p>
            <p className="text-lg text-gray-700">최종 점수: {게임상태.점수}</p>
          </div>
        )}

        <div className="text-center mb-4">
          <p className="text-gray-600">
            {게임상태.게임시작 && !게임상태.게임오버
              ? "떨어지는 물체를 클릭해서 없애보세요!"
              : "게임을 시작하려면 버튼을 클릭하세요."}
          </p>
        </div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            onClick={물체클릭처리}
            className="border-2 border-gray-300 rounded-lg cursor-crosshair"
            style={{
              width: "800px",
              height: "600px",
              maxWidth: "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FallingObjectsGame;
