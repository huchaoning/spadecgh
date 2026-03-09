#include <iostream>
#include <vector>
#include <string>
#include <random> // 用于生成随机数
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "../../third_party/json.hpp"

using json = nlohmann::json;
using namespace emscripten;

// 全局静态缓冲区，避免重复申请内存带来的开销
std::vector<uint8_t> resultBuffer;

val generateCGH(std::string jsonStr) {
    try {
        auto data = json::parse(jsonStr);
        
        // 1. 获取分辨率
        int width = data["global"]["resolution"][0];
        int height = data["global"]["resolution"][1];
        
        // 2. 确保缓冲区大小正确
        uint32_t totalPixels = width * height;
        if (resultBuffer.size() != totalPixels) {
            resultBuffer.resize(totalPixels);
        }

        // 3. 填充数据 (这里演示生成随机噪声)
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, 255);

        for (uint32_t i = 0; i < totalPixels; ++i) {
            resultBuffer[i] = static_cast<uint8_t>(dis(gen));
            // 如果想要全白测试，就改写成: resultBuffer[i] = 255;
        }

        // 4. 返回内存视图给 JS
        return val(typed_memory_view(resultBuffer.size(), resultBuffer.data()));

    } catch (std::exception& e) {
        std::cerr << "WASM Error: " << e.what() << std::endl;
        return val::null();
    }
}

EMSCRIPTEN_BINDINGS(cgh_wasm) {
    function("generateCGH", &generateCGH);
}