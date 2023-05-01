var fs = require("fs");
var docs = require("./docs.json");
var customArgs = {
    "IScriptEvent.scheduleScript(delay,func)": "delay: number, func: (c: IScriptEvent) => void",
    "IScriptEvent.scheduleScript(delay,consumer)": "delay: number, consumer: (c: IScriptEvent) => void"
};
var customExtends = {
    IScriptPlayer: "IScriptEntity",
    IScriptNpc: "IScriptEntity",
    INBTList: "INBT",
    INBTCompound: "INBT",
    UIClickComponent: "UIComponent",
    UIGraphicsComponent: "UIComponent",
    UIIconButtonComponent: "UIComponent",
    UIStackComponent: "UIComponent",
    UIStringListComponent: "UIComponent",
    UITrackpadComponent: "UIComponent",

    UIParentComponent: "UIComponent",
    UILayoutComponent: "UIParentComponent",

    UILabelBaseComponent: "UIComponent",
    UIButtonComponent: "UILabelBaseComponent",
    UILabelComponent: "UILabelBaseComponent",
    UITextareaComponent: "UILabelBaseComponent",
    UITextboxComponent: "UILabelBaseComponent",
    UITextComponent: "UILabelBaseComponent",
    UIToggleComponent: "UILabelBaseComponent"
}

function convertType(type)
{
    if (type === "float" || type === "double" || type === "short" || type === "long" || type === "byte" || type === "int")
    {
        return "number";
    }
    else if (type === "java.lang.String")
    {
        return "string";
    }
    else if (type === "java.util.function.Consumer")
    {
        return "function";
    }

    var index = type.lastIndexOf(".");

    return index >= 0 ? type.substr(index + 1) : type;
}

function sanitizeVariableName(name)
{
    if (name === "function")
    {
        return "func";
    }

    return name;
}

function extractExample(doc)
{
    var codeStart = doc.indexOf("<pre>{@code");
    var codeEnd = doc.indexOf("}</pre>");
    
    if (codeStart < 0)
    {
        return null;
    }

    doc = doc.substr(codeStart + 11, codeEnd - codeStart - 11);
    doc = doc.substr(doc.indexOf("\n") + 1);
    doc = doc.substr(0, doc.lastIndexOf("\n"));

    var indent = 0;

    while (doc[indent] === " ")
    {
        indent += 1;
    }

    doc = doc.split("\n").map(line => line.substr(indent)).join("\n");

    return {
        code: doc,
        offset: codeStart
    };
}

function generateJSDocs(method)
{
    var description = method.doc;
    var example = extractExample(description);

    if (example)
    {
        description = description.substr(0, example.offset);
    }

    var args = method.arguments.map(arg =>
    {
        return `     * @param ${arg.name} ${convertType(arg.type)}${arg.docs ? " - " + arg.docs : ""}`;
    });

    description = description.trim().split("\n").map(arg =>
    {
        return `     *${!arg.startsWith(" ") ? " " + arg : arg}`;
    }).join("\n");

    var output = `    /**\n${description}\n     * \n`;

    if (example)
    {
        output += `     * @example\n`;
        output += example.code.split("\n").map(line => `     *    ${line}`).join("\n");
        output += "\n     * \n";
    }

    if (args.length > 0)
    {
        output += args.join("\n") + "\n";
    }

    output += `     * @returns {@link ${convertType(method.returns.type)}}`

    if (method.returns.doc)
    {
        output += ` - ${method.returns.doc}`;
    }

    output += `\n     */\n`;

    return output;
}

function main()
{
    var output = "// SCRIPTING API\n\n";

    docs.classes.forEach(clazz =>
    {
        var name = convertType(clazz.name);
        var fields = {};
        var customExtend = "";

        function getField(name) 
        {
            name = name[3].toLowerCase() + name.substr(4);

            if (!fields[name])
            {
                fields[name] = {};
            }

            return fields[name];
        }

        if (customExtends[name])
        {
            customExtend = " extends " + customExtends[name];
        }

        output += `declare interface ${name}${customExtend} {\n`;

        clazz.methods.forEach(method =>
        {
            if (method.name.length <= 3)
            {
                return;
            }

            if (method.name.startsWith("get") && name[3].toLowerCase() !== name[3] && method.arguments.length === 0)
            {
                var field = getField(method.name);

                field.getter = true;
                field.type = method.returns.type;
            }
            else if (method.name.startsWith("set") && name[3].toLowerCase() !== name[3] && method.arguments.length === 1)
            {
                var field = getField(method.name);

                field.setter = true;
                field.type = method.arguments[0].type;
            }
        });

        Object.keys(fields).forEach(key => 
        {
            var field = fields[key];

            output += `    ${(field.setter ? "" : "readonly ")}${key}: ${convertType(field.type)}\n`;
        });

        clazz.methods.forEach(method =>
        {
            if (!method.doc)
            {
                return;
            }

            var args = method.arguments.map(arg => 
            {
                return `${sanitizeVariableName(arg.name)}: ${convertType(arg.type)}`;
            }).join(", ");

            var customArgKey = name + "." + method.name + "(" + method.arguments.map(arg => sanitizeVariableName(arg.name)).join(",") + ")";

            if (customArgs[customArgKey])
            {
                args = customArgs[customArgKey];
            }

            output += generateJSDocs(method);
            output += `    ${method.name}(${args}): ${convertType(method.returns.type)}\n`;
        });

        output += "}\n\n";
    });

    fs.writeFileSync("output.ts", output);
}

main();