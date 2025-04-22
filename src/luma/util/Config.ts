import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Config object that can be both read and written to.
 */
export class Config<SettingsType extends object> {
  //TODO: Make this async
  static from<SettingsType extends object>(filepath: string, defaults: SettingsType) {
    console.log(`Loading config ${resolve(filepath)}`)
    const configExists = existsSync(filepath) 
    if ( ! configExists) {
      console.log(`Created new config file at ${ resolve(filepath) }` )
      const cfg = new Config<SettingsType>(defaults, filepath, defaults)
      cfg.save()
      return cfg
    } else {
      const data = JSON.parse((readFileSync(filepath)).toString()) as typeof defaults
      const merged = {...defaults, ...data}
      return new Config<SettingsType>(merged, filepath, defaults)
    }
  }

  public settings: SettingsType
  private filepath: string

  private constructor(settings: SettingsType, filepath: string, defaults: SettingsType
  ) {
    const errors = Config.verifySchema(settings, defaults)
    if (errors.length > 0) {
      let errmsg = `Invalid config: ${filepath}\n`
      errors.forEach( (error) => {
        errmsg += `- ${error}\n`
      })
      throw new Error(errmsg)
    }

    this.settings = settings
    this.filepath = filepath
  }
  save(): void {
    const data = JSON.stringify(this.settings, null, 4)
    writeFile(this.filepath, data).then( () => {
      console.log(`Config saved at ${ resolve(this.filepath) }`)
    })
    .catch( (reason) => {
      console.log(reason)
    })
  }
    

  /**
   * Recursively compares whether or not keys in data exist in defaults. 
   * - Data should not have any keys not present in defaults
   * - Data types should be the same
   * - For programmatic edits, it's up to you to ensure new keys are never created
   * @param data Object you want to verify
   * @param schema Default values for the given config file
   */
  static verifySchema(data: object, schema: object, errors: string[] = [], path = 'root'): string[] {
    const sourceMap = new Map(Object.entries(data))
    const schemaMap = new Map(Object.entries(schema))

    for (const key in sourceMap) {
      if ( ! schemaMap.has(key) ) {
        errors.push(`in ${path}: Unknown key ${key}`)
        continue
      }

      const sourceData = sourceMap.get(key)
      const schemaData = schemaMap.get(key)
      const sourceType = typeof sourceData
      const schemaType = typeof schemaMap.get(key)

      if ( sourceType != schemaType ) {
        errors.push(`in ${path}: Type of ${key} ${sourceType} should be ${schemaType} `)
        continue
      }

      //valid, check child elements
      if ( sourceType == 'object' ) {
        Config.verifySchema(sourceData, schemaData, errors)
      }
      
    }

    return errors
  }
}