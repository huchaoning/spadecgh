#include <iostream>
#include <string>
#include <emscripten/bind.h>
#include "../../third_party/json.hpp"

using json = nlohmann::json;
using namespace emscripten;

// 接收来自前端的 JSON 字符串
void updateConfig(std::string jsonStr) {
    try {
        // 解析字符串
        auto data = json::parse(jsonStr);

        // 尝试读取并打印全局参数作为验证
        double sigma = data["global"]["sigma"];
        int resX = data["global"]["resolution"][0];
        int resY = data["global"]["resolution"][1];
        size_t modeCount = data["modeList"].size();

        std::cout << "[WASM] 接收成功!" << std::endl;
        std::cout << "[WASM] Sigma: " << sigma << " μm" << std::endl;
        std::cout << "[WASM] 分辨率: " << resX << "x" << resY << std::endl;
        std::cout << "[WASM] 模式数量: " << modeCount << std::endl;

    } catch (json::parse_error& e) {
        std::cerr << "[WASM] JSON 解析失败: " << e.what() << std::endl;
    } catch (json::type_error& e) {
        std::cerr << "[WASM] JSON 字段读取错误: " << e.what() << std::endl;
    }
}

EMSCRIPTEN_BINDINGS(my_module) {
    function("updateConfig", &updateConfig);
}