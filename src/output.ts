import { Action }     from '@itrocks/action'
import { getActions } from '@itrocks/action'
import { Need }       from '@itrocks/action'
import { Request }    from '@itrocks/action-request'
import { Route }      from '@itrocks/route'
import { routeOf }    from '@itrocks/route'
import { dataSource } from '@itrocks/storage'

@Need('object', 'new')
@Route('/output')
export class Output extends Action
{

	async html(request: Request)
	{
		const object = await request.getObject() as object // @Need('object')
		const route  = routeOf(this)
		this.actions = getActions(object, route.slice(route.lastIndexOf('/') + 1))
		return this.htmlTemplateResponse(object, request, __dirname + '/output.html')
	}

	async json(request: Request)
	{
		const objects = await request.getObjects()
		if (objects.length === 1) {
			return this.jsonResponse(objects[0])
		}
		if (objects.length > 1) {
			return this.jsonResponse(objects)
		}
		return this.jsonResponse(await dataSource().search(request.type))
	}

}
