"""
TravelMaster 主程序入口。

负责初始化数据库、接收用户输入并执行旅游规划工作流。
"""

import asyncio
import uuid
from db.database import init_db, save_itinerary
from agents.workflow import create_travel_graph
from agents.state import TravelState


async def main():
    """
    主函数：启动 TravelMaster Agent。
    """
    print("🌍 欢迎使用 TravelMaster - AI 智能旅游规划助手")
    
    # 1. 初始化数据库
    await init_db()

    # 2. 编译工作流
    app = create_travel_graph()

    # 3. 获取用户输入
    user_input = input("\n✈️ 请描述您的旅行计划（例如：我想去北京玩三天，喜欢历史和美食）：\n> ")
    
    if not user_input:
        print("❌ 输入不能为空，程序退出。")
        return

    # 4. 初始化状态
    # 为每个会话生成一个唯一的 user_id，用于后续的记忆管理
    initial_state: TravelState = {
        "messages": [],
        "user_input": user_input,
        "plan_steps": [],
        "research_results": [],
        "validation_feedback": None,
        "final_itinerary": None,
        "user_id": str(uuid.uuid4()) 
    }

    print("\n⏳ 正在为您规划行程，请稍候...\n")

    # 5. 执行工作流
    # ainvoke 是 LangGraph 提供的异步执行接口
    final_state = await app.ainvoke(initial_state)

    # 6. 输出结果
    itinerary = final_state.get("final_itinerary")
    if itinerary:
        print("\n" + "="*30 + " 最终行程单 " + "="*30)
        print(itinerary)
        print("="*70)

        # 7. 持久化存储
        await save_itinerary(
            user_id=initial_state["user_id"],
            title=user_input[:20] + "...",  # 截取前20字作为标题
            content=itinerary
        )
        print(f"\n💾 行程已保存至数据库 (User ID: {initial_state['user_id']})")
    else:
        print("❌ 未能生成行程单，请检查日志或重试。")


if __name__ == "__main__":
    # 运行异步主函数
    asyncio.run(main())
