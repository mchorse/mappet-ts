var fs = require("fs");
var docs = require("./docs.json");
var customArgs = {
    "IScriptEvent.scheduleScript(delay,func)": "delay: number, func: (c: IScriptEvent) => void",
    "IScriptEvent.scheduleScript(delay,consumer)": "delay: number, consumer: (c: IScriptEvent) => void",
    "IMappetUIBuilder.stringList(values)": "values: string[]",
    "IMappetUIBuilder.stringList(values,selected)": "values: string[], selected: number",
    "UIStringListComponent.values(values)": "values: string[]|List<string>",
    "UIStringListComponent.setValues(values)": "values: string[]|List<string>",

};
var customReturns = {
    "IScriptPlayer.getFactions()": "Set<string>",
    "IScriptWorld.getEntities(x1,y1,z1,x2,y2,z2)": "List<IScriptEntity>",
    "IScriptWorld.getEntities(x,y,z,radius)": "List<IScriptEntity>",
    "IScriptServer.getEntities(targetSelector)": "List<IScriptEntity>",
    "IScriptServer.getAllPlayers()": "List<IScriptEntity>",
    "IScriptFancyWorld.explode(x1,y1,z1,x2,y2,z2,blocksPercentage)": "List<IScriptEntity>",
    "IScriptFancyWorld.explode(x,y,z,radius,blocksPercentage)": "List<IScriptEntity>",
    "IScriptItemStack.getLoreList()": "List<string>",
    "IScriptItemStack.getCanDestroyBlocks()": "List<string>",
    "IScriptItemStack.getCanPlaceOnBlocks()": "List<string>",
    "IMappetStates.keys()": "Set<string>",
    "IMappetQuests.getIds()": "Set<string>",
    "INBTCompound.keys()": "Set<string>",
    "UIStringListComponent.getValues()": "List<string>",
}
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
    UIToggleComponent: "UILabelBaseComponent",

    "List<T>": "JavaCollection<T>",
    "Set<T>": "JavaCollection<T>",
}
var customDeclares = [
    {
        name: "TileEntity",
        methods: []
    },
    {
        name: "IBlockState",
        methods: []
    },
    {
        name: "EntityPlayerMP",
        methods: []
    },
    {
        name: "AbstractMorph",
        methods: []
    },
    {
        name: "EntityNpc",
        methods: []
    },
    {
        name: "Entity",
        methods: []
    },
    {
        name: "Potion",
        methods: []
    },
    {
        name: "World",
        methods: []
    },
    {
        name: "EnumParticleTypes",
        methods: []
    },
    {
        name: "MinecraftServer",
        methods: []
    },
    {
        name: "RayTraceResult",
        methods: []
    },
    {
        name: "Vector2d",
        methods: []
    },
    {
        name: "Vector3d",
        methods: []
    },
    {
        name: "Vector4d",
        methods: []
    },
    {
        name: "Matrix3d",
        methods: []
    },
    {
        name: "Matrix4d",
        methods: []
    },
    {
        name: "ItemStack",
        methods: []
    },
    {
        name: "Item",
        methods: []
    },
    {
        name: "IInventory",
        methods: []
    },
    {
        name: "NBTTagList",
        methods: []
    },
    {
        name: "NBTTagCompound",
        methods: []
    },
    {
        name: "List<T>",
        methods: []
    },
    {
        name: "Map",
        methods: []
    },
    {
        name: "Set<T>",
        methods: []
    },
    {
        name: "JavaCollection<T>",
        methods: []
    },
    {
        name: "JavaAccessor",
        interfaces: [],
        methods: [
            {
                name: "from<T>",
                doc: "Turns Java collection into JS array",
                returns: {
                    "type": "T[]"
                },
                arguments: [
                    {
                        name: "collection",
                        type: "JavaCollection<T>"
                    }
                ],
                annotations: []
            },
            {
                name: "type",
                doc: "Takes a string with the fully qualified Java class name, and returns the corresponding <b>JavaClass</b> function object.",
                returns: {
                    "type": "any"
                },
                arguments: [
                    {
                        name: "className",
                        type: "string"
                    }
                ],
                annotations: []
            },
        ],
    },
];
var ignoreFields = [
    "IScriptPlayer.getFactions",
    "IScriptEntity.getMount",
    "IScriptEntity.setBurning",
    "UIParentComponent.getChildComponents",
    "UIStringListComponent.getValues",
    "UIStringListComponent.setValues",
    "UILabelBaseComponent.getLabel",
    "UIComponent.getChanges",
    "UIComponent.getChildComponents",
];
var customLines = [
    "declare const Java: JavaAccessor;",
    "declare const mappet: IScriptFactory;"
]

function convertType(type)
{
    if (type === "float" || type === "double" || type === "short" || type === "long" || type === "byte" || type === "int") {
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
    var classes = [...docs.classes, ...customDeclares];

    classes.forEach(clazz =>
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
            if (method.name.length <= 3 || ignoreFields.indexOf(name + "." + method.name) !== -1)
            {
                return;
            }

            if (method.name.startsWith("get") && method.name[3].toLowerCase() !== method.name[3] && method.arguments.length === 0)
            {
                var field = getField(method.name);

                var customReturnsKey = name + "." + method.name + "(" + method.arguments.map(arg => sanitizeVariableName(arg.name)).join(",") + ")";

                var returnsType = customReturns[customReturnsKey] ? customReturns[customReturnsKey] : method.returns.type;

                field.getter = true;
                field.type = returnsType;
            } else if (method.name.startsWith("set") && method.name[3].toLowerCase() !== method.name[3] && method.arguments.length === 1) {
                var field = getField(method.name);

                field.setter = true;
            }
        });

        Object.keys(fields).forEach(key =>
        {
            var field = fields[key];
            if (!field.type)
            {
                return;
            }
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

            var returnsType = customReturns[customArgKey] ? customReturns[customArgKey] : method.returns.type;

            output += generateJSDocs(method);
            output += `    ${method.name}(${args}): ${convertType(returnsType)}\n`;
        });

        output += "}\n\n";
    });

    customLines.forEach(line => output += line + '\n\n');

    fs.writeFileSync("output.d.ts", output);
}

main();