export default class Role {

    public static fromObject(object: {id: number, name: string}) {
        return new Role(object.id, object.name);
    }

    constructor(
        public readonly id: number,
        public readonly name: string
    ) {
    }
}