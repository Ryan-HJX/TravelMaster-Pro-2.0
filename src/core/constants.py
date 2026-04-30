from __future__ import annotations

from enum import Enum


class WorkflowStep(Enum):
    """Enumeration of workflow step IDs."""
    INTENT_PARSER = "intent_parser"
    GEO_GROUNDING = "geo_grounding"
    POI_SELECTOR = "poi_selector"
    ROUTE_OPTIMIZER = "route_optimizer"
    WEATHER_ADJUSTER = "weather_adjuster"
    SCORING = "scoring"
    FINANCE_ADVISOR = "finance_advisor"
    TRANSPORT_PLANNER = "transport_planner"
    RENDERER = "renderer"


WORKFLOW_STEPS_CONFIG = [
    (WorkflowStep.INTENT_PARSER.value, "意图解析", "正在深度解析您的旅行意图..."),
    (WorkflowStep.GEO_GROUNDING.value, "地理校准", "正在通过高德地图进行地理位置校准..."),
    (WorkflowStep.POI_SELECTOR.value, "景点筛选", "正在筛选目的地附近的精品景点和餐厅..."),
    (WorkflowStep.ROUTE_OPTIMIZER.value, "路线规划", "正在为您规划最合理的交通路线..."),
    (WorkflowStep.WEATHER_ADJUSTER.value, "天气调整", "正在结合目的地天气情况调整行程..."),
    (WorkflowStep.SCORING.value, "质量评估", "正在对行程质量进行多维度评估打分..."),
    (WorkflowStep.FINANCE_ADVISOR.value, "资金建议", "正在结合盈米金融能力为您生成资金建议..."),
    (WorkflowStep.TRANSPORT_PLANNER.value, "大交通规划", "正在为您规划往返大交通方案..."),
    (WorkflowStep.RENDERER.value, "行程渲染", "正在为您绘制精美的旅行地图与文档..."),
]
